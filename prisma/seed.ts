import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production database initialization...');

  // 1. Seed Super Admin User dynamically from environment variables
  const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || 'nv01110612@gmail.com').toLowerCase();
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || 'nv01110612@gmail.com';
  const passwordHash = await argon2.hash(rawPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true
    },
    create: {
      email: adminEmail,
      phone: '09360931606',
      name: 'Super Admin',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true
    }
  });

  console.log(`✅ Production Super Admin configured: ${adminUser.email}`);

  // 2. Seed Default Production Site Settings
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {
      businessName: process.env.BUSINESS_NAME || 'Veerika Rose Garden',
      tagline: process.env.BUSINESS_TAGLINE || 'Premier Plant Nursery & Farm Direct Gardens',
      phone: process.env.BUSINESS_PHONE || '+91 72008 26129',
      email: process.env.BUSINESS_EMAIL || 'support@veerikarosegarden.com',
      whatsapp: process.env.BUSINESS_WHATSAPP || '+917200826129',
      address: process.env.BUSINESS_ADDRESS || 'Hosur & Madurai Nursery Road, Tamil Nadu, India',
      googleMapsUrl: process.env.BUSINESS_MAPS_URL || 'https://maps.google.com',
      workingHours: 'Mon - Sun: 7:00 AM - 8:00 PM',
      taxRate: 5,
      shippingFee: 50,
      freeShippingThreshold: 499,
      phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
      phonepeSaltKey: process.env.PHONEPE_SALT_KEY || '',
      phonepeSaltIndex: process.env.PHONEPE_SALT_INDEX || '1',
      phonepeEnv: (process.env.PHONEPE_ENV as string) || 'PRODUCTION'
    },
    create: {
      id: 'default',
      businessName: process.env.BUSINESS_NAME || 'Veerika Rose Garden',
      tagline: process.env.BUSINESS_TAGLINE || 'Premier Plant Nursery & Farm Direct Gardens',
      phone: process.env.BUSINESS_PHONE || '+91 72008 26129',
      email: process.env.BUSINESS_EMAIL || 'support@veerikarosegarden.com',
      whatsapp: process.env.BUSINESS_WHATSAPP || '+917200826129',
      address: process.env.BUSINESS_ADDRESS || 'Hosur & Madurai Nursery Road, Tamil Nadu, India',
      googleMapsUrl: process.env.BUSINESS_MAPS_URL || 'https://maps.google.com',
      workingHours: 'Mon - Sun: 7:00 AM - 8:00 PM',
      taxRate: 5,
      shippingFee: 50,
      freeShippingThreshold: 499,
      phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
      phonepeSaltKey: process.env.PHONEPE_SALT_KEY || '',
      phonepeSaltIndex: process.env.PHONEPE_SALT_INDEX || '1',
      phonepeEnv: (process.env.PHONEPE_ENV as string) || 'PRODUCTION'
    }
  });
  console.log('✅ Default Site Settings initialized.');

  // 3. Seed Categories and 107 Products if needed
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

  const existingCount = await prisma.product.count();
  if (existingCount === 0) {
    const jsonPath = path.resolve(process.cwd(), 'scratch/vrg_107_products.json');
    if (fs.existsSync(jsonPath)) {
      const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
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
      console.log(`✅ Seeded ${products.length} authentic VRG Nursery products!`);
    }
  } else {
    console.log(`✅ Products already present in database (${existingCount} products).`);
  }

  console.log('🎉 Production database setup completed cleanly!');
}

main()
  .catch((e) => {
    console.error('❌ Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
