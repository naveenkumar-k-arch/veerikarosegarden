import express from 'express';
import { db } from './db.js';
import { PhonePeService } from './phonepe.js';
import { RazorpayService } from './razorpay.js';
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
import { calculateDeliveryFee } from '../utils/delivery.js';
import { generateDispatchLabelsPdf } from './utils/labelPdf.js';

export const apiRouter = express.Router();

apiRouter.use(express.json({ limit: '15mb' }));
apiRouter.use(express.urlencoded({ extended: true, limit: '15mb' }));
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
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const { search, categoryId, featured, bestSeller, minPrice, maxPrice, sort } = req.query;
    const hasFilter = Boolean(search || categoryId || featured === 'true' || bestSeller === 'true' || minPrice || maxPrice || sort);
    const products = await db.getProducts(hasFilter ? {
      search: search as string,
      categoryId: categoryId as string,
      featured: featured === 'true',
      bestSeller: bestSeller === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as string
    } : undefined);
    res.json({ success: true, count: products.length, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    if (req.query.confirm !== 'CONFIRM_DELETE_ALL') {
      return res.status(400).json({ success: false, message: 'Bulk deletion requires explicit confirmation parameter (?confirm=CONFIRM_DELETE_ALL).' });
    }
    await db.deleteAllProducts();
    res.json({ success: true, message: 'All products removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.delete('/products/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

// ================= CATEGORY ROUTES =================
apiRouter.get('/categories', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const { onlyFeatured, showAll } = req.query;
    const isFeaturedOnly = onlyFeatured === 'true';
    const isShowAll = showAll === 'true';
    const hasCatFilter = Boolean(onlyFeatured || showAll);
    const categories = await db.getCategories(hasCatFilter ? {
      onlyActive: !isShowAll,
      onlyFeatured: isFeaturedOnly
    } : undefined);
    res.json({ success: true, count: categories.length, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/admin/categories', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const categories = await db.getCategories({ onlyActive: false });
    res.json({ success: true, count: categories.length, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    if (req.query.confirm !== 'CONFIRM_DELETE_ALL') {
      return res.status(400).json({ success: false, message: 'Bulk deletion requires explicit confirmation parameter (?confirm=CONFIRM_DELETE_ALL).' });
    }
    await db.deleteAllCategories();
    res.json({ success: true, message: 'All categories removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

// ================= BANNERS & COUPONS =================
const DEFAULT_BANNERS = [
  {
    id: 'banner-1',
    title: 'ðŸŒ¸ Premium Rose Plants â€“ Direct from Our Farm',
    subtitle: 'Hybrid & Rare Varieties. Free Shipping above â‚¹499.',
    imageUrl: 'https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Rose Varieties',
    active: true,
    order: 1
  },
  {
    id: 'banner-2',
    title: 'ðŸŒ¿ Fresh Jasmine & Herbal Plants',
    subtitle: 'Jadhi Malli, Ramar Malli & More â€“ Grown with Love',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Jasmine Varieties',
    active: true,
    order: 2
  },
  {
    id: 'banner-3',
    title: 'ðŸŒ¹ Rare & Exotic Roses Collection',
    subtitle: 'Black Magic, Moncou & Tiger Rose â€“ Limited Stock!',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Rare & Exotic Roses',
    active: true,
    order: 3
  }
];

apiRouter.get('/banners', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    let banners = await db.getBanners();
    // Auto-seed default banners if table is empty
    if (!banners || banners.length === 0) {
      banners = DEFAULT_BANNERS;
    }
    res.json({ success: true, banners });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

const handleCreateBanner = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const banner = await db.addBanner(req.body);
    res.status(201).json({ success: true, banner, message: 'Banner created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

apiRouter.post('/banners', requireAdmin, handleCreateBanner);
apiRouter.post('/admin/banners', requireAdmin, handleCreateBanner);

const handleUpdateBanner = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.params?.id || req.body?.id;
    if (!id) return res.status(400).json({ success: false, message: 'Banner ID required' });
    const banner = await db.updateBanner(id, req.body);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner, message: 'Banner updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

apiRouter.put('/banners/:id', requireAdmin, handleUpdateBanner);
apiRouter.put('/admin/banners/:id', requireAdmin, handleUpdateBanner);
apiRouter.post('/admin/banners/:id/update', requireAdmin, handleUpdateBanner);

const handleDeleteBanner = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.params?.id || req.body?.id || (req.query?.id as string);
    if (!id) return res.status(400).json({ success: false, message: 'Banner ID is required' });
    await db.deleteBanner(String(id));
    res.json({ success: true, message: `Banner #${id} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

apiRouter.delete('/banners/:id', requireAdmin, handleDeleteBanner);
apiRouter.delete('/admin/banners/:id', requireAdmin, handleDeleteBanner);
apiRouter.post('/banners/delete', requireAdmin, handleDeleteBanner);
apiRouter.post('/admin/banners/delete', requireAdmin, handleDeleteBanner);
apiRouter.post('/admin/banners/:id/delete', requireAdmin, handleDeleteBanner);

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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
        message: `Minimum order amount of â‚¹${coupon.minOrder} required for coupon ${coupon.code}`
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
      message: `Coupon '${coupon.code}' applied successfully! ðŸŽ‰`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});


apiRouter.get('/coupons', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json({ success: true, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

apiRouter.post('/coupons/delete', requireAdmin, handleDeleteCoupon);
apiRouter.delete('/coupons', requireAdmin, handleDeleteCoupon);
apiRouter.delete('/coupons/:id', requireAdmin, handleDeleteCoupon);
apiRouter.post('/coupons/:id/delete', requireAdmin, handleDeleteCoupon);
apiRouter.delete('/admin/coupons/:id', requireAdmin, handleDeleteCoupon);

// ================= COMBOS & OFFERS =================
apiRouter.get('/combos', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const combos = await db.getCombos();
    res.json({ success: true, count: combos.length, combos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch plant combos' });
  }
});

apiRouter.post('/admin/combos', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const combo = await db.addCombo(req.body);
    res.status(201).json({ success: true, combo, message: 'Plant combo package created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.put('/admin/combos/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await db.updateCombo(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Combo not found' });
    res.json({ success: true, combo: updated, message: 'Combo package updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const handleDeleteCombo = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.params.id || req.body?.id;
    if (!id) return res.status(400).json({ success: false, message: 'Combo ID is required' });
    await db.deleteCombo(id);
    res.json({ success: true, message: 'Combo package deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete combo package' });
  }
};

apiRouter.delete('/admin/combos/:id', requireAdmin, handleDeleteCombo);
apiRouter.post('/admin/combos/:id/delete', requireAdmin, handleDeleteCombo);
apiRouter.delete('/combos/:id', requireAdmin, handleDeleteCombo);
apiRouter.post('/combos/:id/delete', requireAdmin, handleDeleteCombo);
apiRouter.post('/combos/delete', requireAdmin, handleDeleteCombo);




// ================= REVIEWS =================
apiRouter.get('/reviews', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const { productId } = req.query;
    const reviews = await db.getReviews(productId as string | undefined);
    res.json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.post('/reviews', async (req, res) => {
  try {
    const review = await db.addReview(req.body);
    res.status(201).json({ success: true, review, message: 'Review submitted successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/admin/reviews', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const review = await db.addReview(req.body);
    res.status(201).json({ success: true, review, message: 'Review created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.put('/admin/reviews/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const review = await db.updateReview(req.params.id, req.body);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, review, message: 'Review updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/admin/reviews/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteReview(req.params.id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.delete('/reviews/:id', async (req, res) => {
  try {
    await db.deleteReview(req.params.id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    if (paymentMethod === 'RAZORPAY' && settings.enableRazorpay === false) {
      return res.status(400).json({ success: false, message: 'Razorpay payment method is currently disabled by admin.' });
    }
    if (paymentMethod === 'COD' && settings.enableCod === false) {
      return res.status(400).json({ success: false, message: 'Cash on Delivery (COD) is currently disabled by admin.' });
    }
    if ((paymentMethod === 'QR_PAYMENT' || paymentMethod === 'UPI_DIRECT') && settings.enableQrPayment === false) {
      return res.status(400).json({ success: false, message: 'Scan QR Code payment method is currently disabled by admin.' });
    }

    // Enforce mandatory payment screenshot ONLY for manual QR/UPI transfers
    // PhonePe, Razorpay, COD use gateway verification — screenshot is not required
    if (paymentMethod === 'QR_PAYMENT' || paymentMethod === 'UPI_DIRECT') {
      if (!paymentProofUrl || typeof paymentProofUrl !== 'string' || !paymentProofUrl.trim()) {
        return res.status(400).json({ success: false, message: 'Payment screenshot/proof is mandatory for QR Code / UPI payment. Please upload your GPay or PhonePe receipt photo.' });
      }
      // Check maximum screenshot payload size (5MB base64 string)
      if (paymentProofUrl.length > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Payment screenshot image file size exceeds the 5MB limit. Please upload a smaller image or screenshot.' });
      }
    }

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    const allProducts = await db.getProducts();
    const allCombos = await db.getCombos();

    for (const item of items) {
      if (!item || !item.productId) {
        return res.status(400).json({ success: false, message: 'Invalid item format in order request.' });
      }

      // Enforce positive integer quantity
      const validQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (isNaN(validQty) || validQty < 1) {
        return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
      }

      // Check if it's a combo item
      const matchedCombo = allCombos.find(c => c.id === item.productId || (item.productId && item.productId.includes(c.id)));
      if (matchedCombo) {
        const verifiedPrice = Number(matchedCombo.comboPrice);
        const itemTotal = verifiedPrice * validQty;
        calculatedSubtotal += itemTotal;

        verifiedItems.push({
          productId: matchedCombo.id,
          sku: 'CMB-' + matchedCombo.id.slice(-6),
          name: matchedCombo.title,
          tamilName: matchedCombo.subtitle || 'சிறப்பு சேர்க்கை தொகுப்பு',
          price: verifiedPrice,
          mrp: Number(matchedCombo.originalPrice || verifiedPrice),
          quantity: validQty,
          image: matchedCombo.imageUrl || matchedCombo.products?.[0]?.images?.[0] || '',
          freeDelivery: matchedCombo.freeDelivery === true,
          isCombo: true
        });
        continue;
      }

      // Strictly lookup product from Server Database — NEVER trust client-supplied prices
      let dbProduct = await db.getProductById(item.productId);
      if (!dbProduct) {
        dbProduct = allProducts.find(p => p.id === item.productId || p.sku === item.sku) || null;
      }

      if (!dbProduct) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name || item.productId}' is invalid or no longer available.`
        });
      }

      // Enforce database price
      const verifiedPrice = Number(dbProduct.sellingPrice);
      if (isNaN(verifiedPrice) || verifiedPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid product pricing configuration.' });
      }

      const itemTotal = verifiedPrice * validQty;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        productId: dbProduct.id,
        sku: dbProduct.sku,
        name: dbProduct.name,
        tamilName: dbProduct.tamilName,
        price: verifiedPrice,
        mrp: dbProduct.mrp,
        quantity: validQty,
        image: (dbProduct.images && dbProduct.images.length > 0) ? dbProduct.images[0] : ''
      });
    }

    // Coupon verification against server-calculated subtotal
    let discount = 0;
    if (couponCode) {
      const coupon = await db.getCouponByCode(couponCode);
      if (coupon && coupon.active && calculatedSubtotal >= (coupon.minOrder || 0)) {
        const couponType = (coupon as any).type || (coupon as any).discountType || 'FIXED';
        const couponValue = Number(coupon.value || (coupon as any).discountValue || 0);

        if (couponType === 'PERCENT' || couponType === 'PERCENTAGE') {
          discount = (calculatedSubtotal * couponValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
        } else {
          discount = couponValue;
        }
      }
    }

    // Server-side Pot Charge calculation (ignore client potCharge override)
    const potOption = (req.body.potOption as string) || 'NONE';
    const totalPlantCount = verifiedItems.reduce((sum, i) => sum + i.quantity, 0);
    const potUnitFee = potOption === '6_INCH' ? 99 : potOption === '8_INCH' ? 199 : 0;
    const potCharge = potUnitFee * totalPlantCount;

    // Server-side Shipping Charge calculation
    const targetState = shippingAddress?.state || 'Tamil Nadu';
    const shippingCharge = potOption !== 'NONE' ? 0 : calculateDeliveryFee(verifiedItems, targetState);

    // Final Grand Total calculated strictly on server
    const calculatedGrandTotal = Math.max(1, Math.round(calculatedSubtotal + potCharge + shippingCharge - Math.min(discount, calculatedSubtotal)));

    const merchantTransactionId = 'MT' + Date.now() + Math.floor(10 + Math.random() * 89);

    const userId = req.user ? req.user.id : (req.body.userId || undefined);
    const finalName = customerName || req.user?.name || 'Valued Customer';
    const finalPhone = customerPhone || req.user?.phone || '';
    const finalEmail = req.user?.email || customerEmail || '';

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
      potCharge,
      potOption,
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

    if (paymentMethod === 'RAZORPAY') {
      const rzpRes = await RazorpayService.createOrder(
        {
          amount: calculatedGrandTotal,
          receipt: newOrder.id,
          notes: {
            orderId: newOrder.id,
            merchantTransactionId,
            customerPhone: finalPhone,
            customerName: finalName
          }
        },
        (settings.razorpayKeyId && settings.razorpayKeyId.trim()) || process.env.RAZORPAY_KEY_ID || 'rzp_test_TPhhoBxVXsxTpD',
        (settings.razorpayKeySecret && settings.razorpayKeySecret.trim()) || process.env.RAZORPAY_KEY_SECRET || 'deYVUZfzzRp1mXaqioKd3GZw'
      );

      if (!rzpRes.success || !rzpRes.razorpayOrderId) {
        let errorMsg = rzpRes.message || 'Failed to initialize Razorpay payment order.';
        if (errorMsg.toLowerCase().includes('authentication failed')) {
          errorMsg = 'Razorpay Authentication Failed: The API Key Secret for this Key ID is invalid or was regenerated. Please copy the latest Key ID and Secret from Razorpay Dashboard (Settings → API Keys) and save them in Admin Settings or Vercel.';
        }
        return res.status(400).json({
          success: false,
          message: errorMsg
        });
      }

      return res.json({
        success: true,
        order: newOrder,
        orderId: newOrder.id,
        razorpayOrderId: rzpRes.razorpayOrderId,
        razorpayKeyId: (settings.razorpayKeyId && settings.razorpayKeyId.trim()) || process.env.RAZORPAY_KEY_ID || 'rzp_test_TPhhoBxVXsxTpD',
        amount: calculatedGrandTotal,
        customerName: finalName,
        customerEmail: finalEmail,
        customerPhone: finalPhone,
        message: 'Order created. Proceed to Razorpay payment.'
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
    console.error('POST /api/orders error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error processing order. Please try again.' });
  }
});

apiRouter.get('/orders', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in to view orders.' });
    }

    let orders = await db.getOrders();
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      orders = orders.filter(o => 
        (o.userId && o.userId === user.id) ||
        (o.customerEmail && user.email && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
        (o.customerPhone && user.phone && o.customerPhone.replace(/\D/g, '').slice(-10) === user.phone.replace(/\D/g, '').slice(-10))
      );
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/admin/orders', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/admin/dashboard', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/admin/bootstrap', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const [
      orders,
      products,
      categories,
      coupons,
      banners,
      reviews,
      settings,
      paymentLogs,
      finances,
      combos
    ] = await Promise.all([
      db.getOrders().catch(() => []),
      db.getProducts().catch(() => []),
      db.getCategories().catch(() => []),
      db.getCoupons().catch(() => []),
      db.getBanners().catch(() => []),
      db.getReviews().catch(() => []),
      db.getSettings().catch(() => null),
      db.getPaymentLogs().catch(() => []),
      db.getFinancialEntries().catch(() => []),
      db.getCombos().catch(() => [])
    ]);

    const stats = await db.getDashboardStats(orders, products);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      stats,
      products,
      categories,
      orders,
      coupons,
      banners,
      reviews,
      settings,
      paymentLogs,
      finances,
      combos
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin bootstrap data' });
  }
});


apiRouter.get('/orders/user/:identifier', async (req: AuthenticatedRequest, res) => {
  try {
    const { identifier } = req.params;
    const authUser = req.user;
    const cleanId = (identifier || '').toLowerCase().trim();

    if (!cleanId || cleanId === 'all' || cleanId === 'guest') {
      return res.json({ success: true, count: 0, orders: [] });
    }

    // Security check: If caller is authenticated as customer (non-admin), prevent requesting another user's identifier
    if (authUser && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      const selfId = (authUser.id || '').toLowerCase();
      const selfEmail = (authUser.email || '').toLowerCase();
      const selfPhone = (authUser.phone || '').replace(/\D/g, '').slice(-10);
      const reqNum = cleanId.replace(/\D/g, '').slice(-10);

      const isMatchesSelf = (selfId && cleanId === selfId) ||
        (selfEmail && cleanId === selfEmail) ||
        (selfPhone && reqNum && reqNum === selfPhone);

      if (!isMatchesSelf) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your own account orders.' });
      }
    }

    const allOrders = await db.getOrders();
    const numOnly = cleanId.replace(/\D/g, '');

    const matchedOrders = allOrders.filter(o => {
      // 1. Session User Match (Strict)
      if (authUser) {
        if (o.userId && authUser.id && o.userId === authUser.id) return true;
        if (o.customerEmail && authUser.email && o.customerEmail.toLowerCase() === authUser.email.toLowerCase()) return true;
        if (o.customerPhone && authUser.phone && o.customerPhone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) return true;
      }

      // 2. Direct exact identifier field match (Strict ID / Email / Phone only)
      const p = (o.customerPhone || '').replace(/\D/g, '');
      const e = (o.customerEmail || '').toLowerCase();
      const u = (o.userId || '').toLowerCase();

      // Match exact User ID
      if (u && u === cleanId) return true;

      // Match exact Email address
      if (cleanId.includes('@') && e && e === cleanId) return true;

      // Match exact 10-digit Phone number
      if (numOnly.length >= 10 && p && p.slice(-10) === numOnly.slice(-10)) return true;

      return false;
    });

    res.json({
      success: true,
      count: matchedOrders.length,
      orders: matchedOrders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/orders/:id', async (req: AuthenticatedRequest, res) => {
  try {
    let order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: If authenticated as customer (non-admin), ensure order belongs to caller
    const user = req.user;
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const isOwner = (order.userId && order.userId === user.id) ||
        (order.customerEmail && user.email && order.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
        (order.customerPhone && user.phone && order.customerPhone.replace(/\D/g, '').slice(-10) === user.phone.replace(/\D/g, '').slice(-10));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your own orders.' });
      }
    }

    // Non-blocking background PhonePe status check if explicitly requested with short timeout
    if (req.query.verify === 'phonepe' && order.paymentMethod === 'PHONEPE' && order.paymentStatus === 'PENDING' && order.merchantTransactionId) {
      Promise.race([
        PhonePeService.checkStatus(order.merchantTransactionId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]).catch(() => {});
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

// Admin GET all orders - no user filtering, always returns every order from every customer
apiRouter.get('/admin/orders', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

// Admin update order status
apiRouter.put('/admin/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderStatus, trackingNumber, courierName, paymentStatus, paymentProofUrl } = req.body;
    const order = await db.updateOrderStatus(req.params.id, orderStatus, trackingNumber, courierName, paymentStatus, paymentProofUrl);
    res.json({ success: true, order, message: 'Order status updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

apiRouter.delete('/admin/orders/:id', requireAdmin, handleDeleteOrderRoute);
apiRouter.post('/admin/orders/delete', requireAdmin, handleDeleteOrderRoute);
apiRouter.post('/admin/orders/:id/delete', requireAdmin, handleDeleteOrderRoute);

// ================= DISPATCH LABELS PDF ENDPOINT =================
const handleGenerateLabelsPdf = async (req: express.Request, res: express.Response) => {
  try {
    const orderIdsParam = (req.query.orderIds as string) || req.body?.orderIds;
    const batchNumber = (req.query.batch as string) || req.body?.batch || '#005';
    const sheetNumber = (req.query.sheet as string) || req.body?.sheet || '#11106';

    const allOrders = await db.getOrders();
    let targetOrders = allOrders;

    if (orderIdsParam) {
      const idList = Array.isArray(orderIdsParam)
        ? orderIdsParam
        : String(orderIdsParam).split(',').map(s => s.trim()).filter(Boolean);
      if (idList.length > 0) {
        targetOrders = allOrders.filter(o => idList.includes(o.id));
      }
    }

    if (targetOrders.length === 0 && allOrders.length > 0) {
      targetOrders = allOrders.slice(0, 4);
    }

    const pdfBuffer = generateDispatchLabelsPdf(targetOrders, batchNumber, sheetNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="VRG_Dispatch_Labels_${batchNumber.replace(/[^a-zA-Z0-9]/g, '') || '001'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating PDF labels:', error);
    res.status(500).json({ success: false, message: 'Failed to generate dispatch label PDF' });
  }
};

apiRouter.get('/orders/labels/pdf', handleGenerateLabelsPdf);
apiRouter.post('/orders/labels/pdf', handleGenerateLabelsPdf);
apiRouter.get('/admin/orders/labels/pdf', handleGenerateLabelsPdf);
apiRouter.post('/admin/orders/labels/pdf', handleGenerateLabelsPdf);


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
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

// PhonePe Sandbox Test Callback Endpoint (no auth required - sandbox only)
apiRouter.post('/phonepe/simulate-callback', async (req: AuthenticatedRequest, res) => {
  // Block in production - sandbox simulation only
  if (process.env.NODE_ENV === 'production' || process.env.PHONEPE_ENV === 'PRODUCTION') {
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
  if (!merchantTransactionId || !amount) {
    return res.status(400).json({ success: false, message: 'merchantTransactionId and amount required' });
  }
  const refundResult = await PhonePeService.initiateRefund(merchantTransactionId, Number(amount));
  res.json(refundResult);
});

// ================= RAZORPAY CREATE ORDER API =================
const handleCreateRazorpayOrder = async (req: AuthenticatedRequest, res: any) => {
  try {
    let { amount, currency = 'INR', receipt, notes } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Amount is required.' });
    }

    let amountInPaise: number;
    let amountInRupees: number;

    // Support both paise (amountInPaise flag or amount >= 100 with paise indicator) and standard Rupees
    if (req.body.amountInPaise || req.body.isPaise) {
      amountInPaise = Math.round(Number(amount));
      amountInRupees = amountInPaise / 100;
    } else {
      amountInRupees = Number(amount);
      amountInPaise = Math.round(amountInRupees * 100);
    }

    if (amountInPaise < 100) {
      return res.status(400).json({ success: false, message: 'Minimum transaction amount is ₹1.00 (100 paise).' });
    }

    const settings = await db.getSettings();
    const keyId = (settings?.razorpayKeyId && settings.razorpayKeyId.trim()) || process.env.RAZORPAY_KEY_ID || 'rzp_test_TPhhoBxVXsxTpD';
    const keySecret = (settings?.razorpayKeySecret && settings.razorpayKeySecret.trim()) || process.env.RAZORPAY_KEY_SECRET || 'deYVUZfzzRp1mXaqioKd3GZw';

    if (!keyId || !keySecret) {
      return res.status(401).json({ success: false, message: 'Razorpay API credentials not configured.' });
    }

    const rzpRes = await RazorpayService.createOrder(
      {
        amount: amountInRupees,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {}
      },
      keyId,
      keySecret
    );

    if (!rzpRes.success || !rzpRes.razorpayOrderId) {
      let errorMsg = rzpRes.message || 'Failed to create Razorpay order.';
      if (errorMsg.toLowerCase().includes('authentication failed')) {
        errorMsg = 'Razorpay Authentication Failed: The API Key Secret for this Key ID is invalid or was regenerated. Please copy the latest Key ID and Secret from Razorpay Dashboard (Settings → API Keys) and save them in Admin Settings or Vercel.';
      }
      return res.status(400).json({
        success: false,
        message: errorMsg
      });
    }

    return res.json({
      success: true,
      order_id: rzpRes.razorpayOrderId,
      razorpayOrderId: rzpRes.razorpayOrderId,
      amount: amountInPaise,
      currency,
      key_id: keyId,
      keyId
    });
  } catch (err: any) {
    console.error('[Razorpay Create Order] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create Razorpay order' });
  }
};

apiRouter.post('/create-order', checkoutLimiter, handleCreateRazorpayOrder);
apiRouter.post('/razorpay/create-order', checkoutLimiter, handleCreateRazorpayOrder);

// ================= RAZORPAY VERIFY API =================
const handleVerifyRazorpayPayment = async (req: AuthenticatedRequest, res: any) => {
  try {
    const razorpayOrderId = req.body.razorpay_order_id || req.body.razorpayOrderId || req.body.order_id;
    const razorpayPaymentId = req.body.razorpay_payment_id || req.body.razorpayPaymentId || req.body.payment_id;
    const razorpaySignature = req.body.razorpay_signature || req.body.razorpaySignature || req.body.signature;
    const orderId = req.body.orderId || req.body.order_id || req.body.receipt;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature).'
      });
    }

    const settings = await db.getSettings();
    const keySecret = (settings?.razorpayKeySecret && settings.razorpayKeySecret.trim()) || process.env.RAZORPAY_KEY_SECRET || 'deYVUZfzzRp1mXaqioKd3GZw';

    if (!keySecret) {
      return res.status(401).json({ success: false, message: 'Razorpay secret key not configured.' });
    }

    const isValid = RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, keySecret);

    if (!isValid) {
      console.warn('[Razorpay Verify] Invalid signature for order:', orderId || razorpayOrderId);
      return res.status(400).json({ success: false, message: 'Invalid Razorpay payment signature. Payment verification failed.' });
    }

    let updatedOrder = null;
    if (orderId) {
      const order = await db.getOrderById(orderId);
      if (order) {
        updatedOrder = await db.updateOrderStatus(orderId, 'CONFIRMED', undefined, undefined, 'SUCCESS');
        await db.addPaymentLog({
          merchantTransactionId: order.merchantTransactionId || razorpayPaymentId,
          orderId,
          amount: order.grandTotal,
          status: 'SUCCESS',
          checksum: razorpaySignature,
          payload: JSON.stringify({ razorpayOrderId, razorpayPaymentId })
        }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      message: 'Razorpay payment verified successfully!',
      orderId,
      order: updatedOrder
    });
  } catch (err: any) {
    console.error('[Razorpay Verify] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Razorpay verification error' });
  }
};

apiRouter.post('/verify-payment', checkoutLimiter, handleVerifyRazorpayPayment);
apiRouter.post('/razorpay/verify', checkoutLimiter, handleVerifyRazorpayPayment);

// ================= RAZORPAY WEBHOOK HANDLER =================
apiRouter.post('/razorpay/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const settings = await db.getSettings();
    const webhookSecret = (settings as any)?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (signature && webhookSecret) {
      const crypto = await import('crypto');
      const expectedSignature = crypto.createHmac('sha256', webhookSecret.trim()).update(rawBody).digest('hex');
      if (expectedSignature !== signature) {
        console.warn('[Razorpay Webhook] Invalid webhook signature from Razorpay');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;
      const orderId = paymentEntity?.notes?.orderId || orderEntity?.receipt || paymentEntity?.description?.split('#')[1];

      if (orderId) {
        await db.updateOrderStatus(orderId, 'CONFIRMED', undefined, undefined, 'SUCCESS');
        await db.addPaymentLog({
          merchantTransactionId: paymentEntity?.id || orderId,
          orderId,
          amount: paymentEntity?.amount ? paymentEntity.amount / 100 : 0,
          status: 'SUCCESS',
          checksum: signature || 'WEBHOOK_CAPTURED',
          payload: JSON.stringify(req.body)
        }).catch(() => {});
        console.log(`[Razorpay Webhook] Order ${orderId} marked as SUCCESS (${event})`);
      }
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Razorpay Webhook] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ================= ADMIN DASHBOARD & LOGS =================
apiRouter.get('/admin/dashboard', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/admin/payment-logs', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const logs = await db.getPaymentLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

// Financial Expense & Profit Logs
apiRouter.get('/admin/finances', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const entries = await db.getFinancialEntries();
    res.json({ success: true, entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
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

const handleDeleteFinance = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.params?.id || req.body?.id || (req.query?.id as string);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID required for finance entry deletion' });
    }
    const deleted = await db.deleteFinancialEntry(id);
    res.json({ success: true, deleted, message: 'Financial entry removed successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

apiRouter.delete('/admin/finances/:id', requireAdmin, handleDeleteFinance);
apiRouter.post('/admin/finances/delete', requireAdmin, handleDeleteFinance);
apiRouter.post('/admin/finances/:id/delete', requireAdmin, handleDeleteFinance);
apiRouter.delete('/finances/:id', requireAdmin, handleDeleteFinance);
apiRouter.post('/finances/delete', requireAdmin, handleDeleteFinance);

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



// ================= SITE SETTINGS =================
apiRouter.get('/settings', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    const settings = await db.getSettings();
    if (!settings) {
      return res.json({ success: true, settings: {} });
    }

    // Strip sensitive merchant salt keys and internal credentials from public view
    const { phonepeSaltKey, phonepeMerchantId, razorpayKeySecret, ...publicSettings } = settings as any;
    res.json({ success: true, settings: publicSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

apiRouter.get('/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await db.getSettings();
    if (!settings) {
      return res.json({ success: true, settings: {} });
    }
    const SALT_MASK = '••••••••';
    // Mask sensitive PhonePe & Razorpay credentials — they are write-only from the admin UI
    const safeSettings = {
      ...settings,
      phonepeSaltKey: (settings as any)?.phonepeSaltKey ? SALT_MASK : '',
      phonepeMerchantId: (settings as any)?.phonepeMerchantId ? SALT_MASK : '',
      razorpayKeySecret: (settings as any)?.razorpayKeySecret ? SALT_MASK : ''
    };
    res.json({ success: true, settings: safeSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
});

const handleUpdateSettings = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const SALT_MASK = '••••••••';
    const body = { ...req.body };
    // If the client sends back the mask placeholder, strip those fields so the
    // existing DB secret is preserved rather than overwritten with literal dots.
    if (body.phonepeSaltKey === SALT_MASK || body.phonepeSaltKey === '') {
      delete body.phonepeSaltKey;
    }
    if (body.phonepeMerchantId === SALT_MASK || body.phonepeMerchantId === '') {
      delete body.phonepeMerchantId;
    }
    if (body.razorpayKeySecret === SALT_MASK || body.razorpayKeySecret === '') {
      delete body.razorpayKeySecret;
    }
    const updated = await db.updateSettings(body);
    // Return masked version so we never round-trip the real secret back to the client
    const safeUpdated = {
      ...updated,
      phonepeSaltKey: (updated as any).phonepeSaltKey ? SALT_MASK : '',
      phonepeMerchantId: (updated as any).phonepeMerchantId ? SALT_MASK : '',
      razorpayKeySecret: (updated as any).razorpayKeySecret ? SALT_MASK : ''
    };
    res.json({ success: true, settings: safeUpdated, message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' });
  }
};

apiRouter.put('/settings', requireAdmin, handleUpdateSettings);
apiRouter.post('/settings', requireAdmin, handleUpdateSettings);
apiRouter.put('/admin/settings', requireAdmin, handleUpdateSettings);
apiRouter.post('/admin/settings', requireAdmin, handleUpdateSettings);
apiRouter.post('/admin/settings/update', requireAdmin, handleUpdateSettings);

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
    answer: `ðŸŒ¿ Veerika Rose Garden Care Advice:
â€¢ Sunlight & Soil: Ensure 5-6 hours of full direct morning sunlight. Use equal parts soil, dried cow dung manure, and coco peat for best root aeration.
â€¢ Organic Nutrition: Apply 2 tablespoons of organic Rose Mix Fertilizer or Neem Cake powder every 15 days around the root drip line.
â€¢ Pruning: Prune dead stems 45-degrees above an outward facing bud node to trigger new flower shoots.

Need personalized diagnosis? Call our nursery expert directly at +91 72008 26129!`
  });
});

