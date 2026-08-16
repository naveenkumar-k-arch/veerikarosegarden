import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncProducts() {
  console.log('🔄 Starting full catalog database sync for 107 VRG Nursery products...');
  
  const jsonPath = path.resolve(process.cwd(), 'scratch/vrg_107_products.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error('vrg_107_products.json not found in scratch/');
  }

  const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📦 Loaded ${products.length} products to sync.`);

  // 1. Ensure Categories exist in DB
  const categories = [
    {
      id: 'cat-rose',
      name: 'Rose Varieties',
      nameTamil: 'ரோஜா வகைகள்',
      slug: 'rose-varieties',
      image: '/categories/rose-varieties.jpg',
      description: 'Premium live hybrid rose plants, double delight & button rose varieties.',
      order: 1,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-herbals',
      name: 'Herbal Plants',
      nameTamil: 'மூலிகை (Herbals)',
      slug: 'herbals',
      image: '/categories/herbal-plants.jpg',
      description: 'Medicinal plants including Neeli Avuri, Sangu Poo, Aavaram Poo, Vasambu, Vetrilai & Rosemary.',
      order: 2,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-jasmine',
      name: 'Jasmine Varieties',
      nameTamil: 'மல்லி பூ வகைகள் (Jasmine Vts)',
      slug: 'jasmine-varieties',
      image: '/categories/jasmine-varieties.jpg',
      description: 'Fragrant Raja Malli (10 layer), Mysuru Malli, Pachai Mullai, Kakatan & Jadhi Malli.',
      order: 3,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-creeper',
      name: 'Creeper Roses',
      nameTamil: 'கொடி ரோஸ் வகைகள் (Creeper)',
      slug: 'creeper-roses',
      image: '/categories/creeper-roses.jpg',
      description: 'Climbing and hanging rose varieties like Creeper Jackie, Red Cascade & Pink Creeper.',
      order: 4,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-miniature',
      name: 'Miniature Roses',
      nameTamil: 'மினியேச்சர் ரோஸ் வகைகள்',
      slug: 'miniature-roses',
      image: '/categories/miniature-roses.jpg',
      description: 'Compact miniature rose plants for balcony pots, table garden and containers.',
      order: 5,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-rare',
      name: 'Rare & Exotic Roses',
      nameTamil: 'அரிய வகை ரோஜாக்கள் (Rare & Exotic)',
      slug: 'rare-exotic-roses',
      image: '/categories/exotics-rare-roses.jpg',
      description: 'Exclusive rare varieties like Ink Spot, Teddy Bear, Black Jade, Blue For You, Fireworks Ruffle, Black Magic & Abracadabra.',
      order: 6,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-fruits',
      name: 'Fruit Plants',
      nameTamil: 'பழ மரங்கள் (Fruit Plants)',
      slug: 'fruit-plants',
      image: '/categories/fruit-plants.jpg',
      description: 'High-yielding live fruit saplings including Black Grapes, Kalapadi Sapota, Miracle Fruit, Water Apple & PKM 1 Moringa.',
      order: 7,
      isActive: true,
      isFeatured: true
    },
    {
      id: 'cat-flowering',
      name: 'Flowering Plants',
      nameTamil: 'பூச்செடிகள் (Flowering Plants)',
      slug: 'flowering-plants',
      image: '/categories/flowering-plants.jpg',
      description: 'Beautiful fragrant flowering garden plants including Manoranjitham, Parijadham, Krishnakamalam & Shenbagam.',
      order: 8,
      isActive: true,
      isFeatured: true
    }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        nameTamil: cat.nameTamil,
        slug: cat.slug,
        image: cat.image,
        description: cat.description,
        order: cat.order,
        isActive: cat.isActive,
        isFeatured: cat.isFeatured
      },
      create: cat
    });
  }
  console.log('✅ Categories synchronized in database.');

  // 2. Clear old demo products, order items, and relations
  console.log('🗑️ Removing old products and linked items from PostgreSQL database...');
  await prisma.paymentAttempt.deleteMany({}).catch(() => {});
  await prisma.refund.deleteMany({}).catch(() => {});
  await prisma.payment.deleteMany({}).catch(() => {});
  await prisma.orderItem.deleteMany({}).catch(() => {});
  await prisma.order.deleteMany({}).catch(() => {});
  await prisma.cartItem.deleteMany({}).catch(() => {});
  await prisma.wishlistItem.deleteMany({}).catch(() => {});
  await prisma.inventory.deleteMany({}).catch(() => {});
  await prisma.review.deleteMany({}).catch(() => {});
  await prisma.image.deleteMany({}).catch(() => {});
  
  const delCount = await prisma.product.deleteMany({});
  console.log(`Deleted ${delCount.count} existing products from database.`);

  // 3. Insert all 107 products into database
  console.log('🌱 Inserting 107 authentic VRG Nursery products...');
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        sku: p.sku,
        name: p.name,
        nameTamil: p.tamilName || p.name,
        scientificName: p.scientificName || '',
        category: p.categoryName,
        categoryId: p.categoryId,
        price: Number(p.sellingPrice),
        originalPrice: Number(p.mrp),
        rating: Number(p.rating) || 5.0,
        reviewsCount: Number(p.reviewCount) || 12,
        image: p.image,
        images: p.images || [p.image],
        inStock: Number(p.stock) > 0,
        potSize: p.potSize || '8 Inch Bag',
        careSunlight: p.sunlight || 'Full Sun',
        careWatering: p.waterRequirement || 'Daily',
        careSoil: p.careInstructions?.soil || 'Well-draining red soil mixed with 30% coco peat.',
        careFertilizer: p.careInstructions?.fertilizer || 'Apply organic vermicompost / neem cake every 15 days.',
        description: p.description,
        isBestSeller: Boolean(p.bestSeller),
        isFeatured: Boolean(p.featured),
        inventory: {
          create: {
            quantity: Number(p.stock) || 25,
            reserved: 0,
            threshold: 5
          }
        }
      }
    });
  }

  const totalInDb = await prisma.product.count();
  console.log(`🎉 Database seeding finished successfully! Total products in DB: ${totalInDb}`);
}

syncProducts()
  .catch(err => {
    console.error('❌ Error during product sync:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
